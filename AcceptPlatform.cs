using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class AcceptPlatform : MonoBehaviour
{
    public ConventionProposals p1;
    public ConventionProposals p2;
    public ConventionProposals p3;
    public Button mButton;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;
    public float modifier = 2f;
    public GameObject failure;

    // Start is called before the first frame update
    void Start()
    {
        mButton.onClick.AddListener(onButtonClick);
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void onButtonClick()
    {
        if ((p1.choiceIndex == p2.choiceIndex) || (p2.choiceIndex == p3.choiceIndex) || (p1.choiceIndex == p3.choiceIndex))
        {
            failure.SetActive(true);
            return;
        }
        Variables.Saved.Set("Liberal", li + (p1.liberal + p2.liberal + p3.liberal) * modifier);
        Variables.Saved.Set("Libertarian", la + (p1.libertarian + p2.libertarian + p3.libertarian) * modifier);
        Variables.Saved.Set("Workers", wo + (p1.worker + p2.worker + p3.worker) * modifier);
        Variables.Saved.Set("Owners", ow + (p1.owner + p2.owner + p3.owner) * modifier);
        Variables.Saved.Set("Religious", re + (p1.religious + p2.religious + p3.religious) * modifier);
        Variables.Saved.Set("Immigrants", im + (p1.immigrant + p2.immigrant + p3.immigrant) * modifier);
        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex + 1, LoadSceneMode.Single);
    }
}
