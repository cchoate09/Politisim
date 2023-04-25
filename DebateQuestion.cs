 using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class DebateQuestion : MonoBehaviour
{
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public Button yesButton;
    public Button noButton;
    public float li;
    public float la;
    public float re;
    public float wo;
    public float im;
    public float ow;
    public float ap;
    public float debateMult = 0.5f;
    public float debateDiv = 3f;

    // Start is called before the first frame update
    void Start()
    {
        debateMult += (float)Variables.Saved.Get("Debating");
        debateMult /= debateDiv;
        yesButton.onClick.AddListener(delegate {onAnswerClick(1.0f*debateMult); });
        noButton.onClick.AddListener(delegate {onAnswerClick(-1.0f*debateMult); });
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
    }

    void onAnswerClick(float modifier)
    {
        Variables.Saved.Set("Liberal", li + (liberal*modifier));
        Variables.Saved.Set("Libertarian", la + (libertarian*modifier));
        Variables.Saved.Set("Workers", wo + (worker*modifier));
        Variables.Saved.Set("Immigrants", im + (immigrant*modifier));
        Variables.Saved.Set("Owners", ow + (owner*modifier));
        Variables.Saved.Set("Religious", re + (religious*modifier));
        gameObject.SetActive(false);
        transform.parent.gameObject.SetActive(false);
        Destroy(gameObject);
    }


    // Update is called once per frame
    void Update()
    {
        
    }

    IEnumerator waiter()
    {
        yield return new WaitForSecondsRealtime(3);
    }
}
